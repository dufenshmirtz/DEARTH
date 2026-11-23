import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        // black behind the game while it loads, like the launch screen (no white flash)
        window?.backgroundColor = .black
        window?.rootViewController = DearthRootViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// The game's screen, full screen like the Android app (which hides its system bars): the status bar stays hidden and the
// home indicator (the line at the bottom) fades out after a moment, as in most games. Capacitor's own screen
// (CAPBridgeViewController) sits inside this plain UIKit one, so nothing of Capacitor's is overridden: Xcode refuses
// overrides of the prebuilt Capacitor package ("overriding non-open property outside of its defining module"). The
// status bar is also hidden by Capacitor itself, from UIStatusBarHidden in Info.plist.
class DearthRootViewController: UIViewController {
    private let bridgeViewController = CAPBridgeViewController()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        addChild(bridgeViewController)
        bridgeViewController.view.frame = view.bounds
        bridgeViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(bridgeViewController.view)
        bridgeViewController.didMove(toParent: self)
    }

    override var prefersStatusBarHidden: Bool {
        return true
    }

    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    // landscape only, as Capacitor reads it from Info.plist
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return bridgeViewController.supportedInterfaceOrientations
    }
}
